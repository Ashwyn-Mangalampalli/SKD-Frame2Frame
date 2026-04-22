import { Request, Response } from "express";
import { ExcelService } from "../services/ExcelService";
import { supabase, getDefaultTenantId } from "../DB/supabase";
import { calcBalance } from "../utils/math";

export class BulkController {
  static async getTemplate(req: Request, res: Response) {
    try {
      const buffer = ExcelService.generateMasterFile();
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", "attachment; filename=Frame2Frame_Bulk_Template.xlsx");
      res.send(buffer);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  static async exportAll(req: Request, res: Response) {
    try {
      const tenantId = await getDefaultTenantId();
      const [
        { data: clients },
        { data: team },
        { data: events },
        { data: payments },
        { data: artistExpenses },
        { data: outputExpenses }
      ] = await Promise.all([
        supabase.from("clients_master").select("*").eq("tenant_id", tenantId).eq("is_active", true),
        supabase.from("users").select("*"),
        supabase.from("events_master").select("*, clients_master(client_name)").eq("tenant_id", tenantId).eq("is_active", true),
        supabase.from("client_payments").select("*, events_master(display_id)").eq("tenant_id", tenantId).eq("is_active", true),
        supabase.from("artist_expenses").select("*, events_master(display_id), users(full_name)").eq("tenant_id", tenantId).eq("is_active", true),
        supabase.from("output_expenses").select("*, events_master(display_id), users(full_name)").eq("tenant_id", tenantId).eq("is_active", true),
      ]);

      const exportData = {
        [ExcelService.SHEETS.CLIENTS]: (clients ?? []).map(c => [c.display_id, c.client_name, c.phone_number, c.email, c.notes]),
        [ExcelService.SHEETS.TEAM]: (team ?? []).map(u => [u.display_id, u.full_name, u.email, u.phone_number, u.usual_role]),
        [ExcelService.SHEETS.EVENTS]: (events ?? []).map(e => {
          const totalCol = (payments ?? []).filter(p => p.event_id === e.id).reduce((s, p) => s + (p.amount ?? 0), 0);
          const { balance: clientBal, status: payStat } = calcBalance(e.package_value ?? 0, totalCol);
          
          const eventArtist = (artistExpenses ?? []).filter(a => a.event_id === e.id);
          const eventOutput = (outputExpenses ?? []).filter(o => o.event_id === e.id);
          const totalExp = eventArtist.reduce((s,a) => s + (a.total_amount ?? 0), 0) + eventOutput.reduce((s,o) => s + (o.total_amount ?? 0), 0);
          const totalPaid = eventArtist.reduce((s,a) => s + (a.advance_paid ?? 0), 0) + eventOutput.reduce((s,o) => s + (o.advance_paid ?? 0), 0);
          
          return [e.display_id, (e.clients_master as any)?.client_name, e.event_type, e.venue, e.city, e.package_value, e.event_dates?.join(", "), clientBal, totalExp - totalPaid, payStat];
        }),
        [ExcelService.SHEETS.PAYMENTS]: (payments ?? []).map(p => [(p.events_master as any)?.display_id, p.installment_type, p.amount, p.payment_method, p.transaction_id, p.payment_date]),
        [ExcelService.SHEETS.ARTIST_EXPENSES]: (artistExpenses ?? []).map(a => {
          const { status } = calcBalance(a.total_amount ?? 0, a.advance_paid ?? 0);
          return [(a.events_master as any)?.display_id, (a.users as any)?.full_name, a.assignment_role, a.pay_type, a.date_start, a.date_end, a.no_of_days, a.per_day_rate, a.total_amount, a.advance_paid, status];
        }),
        [ExcelService.SHEETS.OUTPUT_EXPENSES]: (outputExpenses ?? []).map(o => {
          const { status } = calcBalance(o.total_amount ?? 0, o.advance_paid ?? 0);
          return [(o.events_master as any)?.display_id, (o.users as any)?.full_name, o.assignment_role, o.deliverable, o.quantity, o.total_amount, o.advance_paid, status];
        }),
      };

      const buffer = ExcelService.generateMasterFile(exportData);
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", "attachment; filename=Frame2Frame_Global_Report.xlsx");
      res.send(buffer);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  static async upload(req: Request, res: Response) {
    try {
      if (!req.file) return res.status(400).json({ error: "No file uploaded" });
      const tenantId = await getDefaultTenantId();
      const sheets = ExcelService.parseUploadedFile(req.file.buffer);
      const stats = { clients: 0, team: 0, events: 0, payments: 0, artistExpenses: 0, outputExpenses: 0 };

      // 1. Process Team
      const teamRows = sheets[ExcelService.SHEETS.TEAM] || [];
      if (teamRows.length > 0) {
        const teamUpdates = teamRows.map(row => ({
          display_id: String(row["Display ID"]).trim(),
          full_name: String(row["Full Name"]).trim(),
          email: String(row["Email"] || "").trim(),
          phone_number: String(row["Phone"] || "").trim(),
          usual_role: String(row["Usual Role"] || "").trim()
        }));
        
        const { data: upsertedUsers, error } = await supabase
          .from("users")
          .upsert(teamUpdates, { onConflict: "display_id" })
          .select("id");

        if (!error && upsertedUsers) {
          stats.team = teamRows.length;
          // Ensure all these users are members of the current workspace
          const memberships = upsertedUsers.map(u => ({
            user_id: u.id,
            tenant_id: tenantId,
            role: "MEMBER"
          }));
          await supabase.from("workspace_memberships").upsert(memberships, { onConflict: "user_id, tenant_id" });
        }
      }

      // 2. Process Clients
      const clientRows = sheets[ExcelService.SHEETS.CLIENTS] || [];
      if (clientRows.length > 0) {
        const clientUpdates = clientRows.map(row => ({
          tenant_id: tenantId,
          display_id: String(row["Display ID"]).trim(),
          client_name: String(row["Client Name"]).trim(),
          phone_number: String(row["Phone"] || "").trim(),
          email: String(row["Email"] || "").trim(),
          notes: String(row["Notes"] || "").trim()
        }));
        const { error } = await supabase.from("clients_master").upsert(clientUpdates, { onConflict: "display_id, tenant_id" });
        if (!error) stats.clients = clientRows.length;
      }

      const [{ data: allClients }, { data: allUsers }] = await Promise.all([
        supabase.from("clients_master").select("id, client_name").eq("tenant_id", tenantId),
        supabase.from("users").select("id, full_name"),
      ]);
      
      // Case-insensitive lookups
      const clientLookup = new Map(allClients?.map(c => [c.client_name.toLowerCase().trim(), c.id]));
      const userLookup = new Map(allUsers?.map(u => [u.full_name.toLowerCase().trim(), u.id]));

      // 3. Process Events
      const eventRows = sheets[ExcelService.SHEETS.EVENTS] || [];
      if (eventRows.length > 0) {
        const eventUpdates = eventRows.map(row => {
          const clientName = String(row["Client Name"] || "").toLowerCase().trim();
          const clientId = clientLookup.get(clientName);
          if (!clientId) return null;
          const dates = row["Dates"] ? String(row["Dates"]).split(",").map(d => d.trim()) : [];
          return {
            tenant_id: tenantId,
            display_id: String(row["Display ID"]).trim(),
            client_id: clientId,
            event_type: String(row["Event Type"]).trim(),
            venue: String(row["Venue"] || "").trim(),
            city: String(row["City"] || "").trim(),
            package_value: Number(row["Package Value"]) || 0,
            event_dates: dates
          };
        }).filter(Boolean);
        const { error } = await supabase.from("events_master").upsert(eventUpdates as any, { onConflict: "display_id, tenant_id" });
        if (!error) stats.events = (eventUpdates as any[]).length;
      }

      const { data: allEvents } = await supabase.from("events_master").select("id, display_id").eq("tenant_id", tenantId);
      const eventLookup = new Map(allEvents?.map(e => [e.display_id.toLowerCase().trim(), e.id]));

      // 4. Process Payments
      const paymentRows = (sheets[ExcelService.SHEETS.PAYMENTS] || []).map(row => {
        const eventId = eventLookup.get(String(row["Event Display ID"] || "").toLowerCase().trim());
        if (!eventId) return null;
        return {
          tenant_id: tenantId,
          event_id: eventId,
          installment_type: String(row["Type"]).trim(),
          amount: Number(row["Amount"]) || 0,
          payment_method: String(row["Method"] || "Cash").trim(),
          transaction_id: String(row["Transaction ID"] || "").trim(),
          payment_date: row["Date"]
        };
      }).filter(Boolean);
      if (paymentRows.length > 0) {
        const { error } = await supabase.from("client_payments").insert(paymentRows as any);
        if (!error) stats.payments = (paymentRows as any[]).length;
      }

      // 5. Process Artist Expenses
      const artistRows = (sheets[ExcelService.SHEETS.ARTIST_EXPENSES] || []).map(row => {
        const eventId = eventLookup.get(String(row["Event Display ID"] || "").toLowerCase().trim());
        const userName = String(row["User Name"] || "").toLowerCase().trim();
        const userId = userLookup.get(userName);
        if (!eventId || !userId) return null;
        return {
          tenant_id: tenantId,
          event_id: eventId,
          user_id: userId,
          assignment_role: String(row["Role"] || "").trim(),
          pay_type: String(row["Pay Type"] || "").trim(),
          date_start: row["Start Date"],
          date_end: row["End Date"],
          no_of_days: Number(row["Days"]) || 1,
          per_day_rate: Number(row["Rate"]) || 0,
          total_amount: Number(row["Total"]) || 0,
          advance_paid: Number(row["Advance"]) || 0,
        };
      }).filter(Boolean);
      if (artistRows.length > 0) {
        const { error } = await supabase.from("artist_expenses").insert(artistRows as any);
        if (!error) stats.artistExpenses = (artistRows as any[]).length;
      }

      // 6. Process Output Expenses
      const outputRows = (sheets[ExcelService.SHEETS.OUTPUT_EXPENSES] || []).map(row => {
        const eventId = eventLookup.get(String(row["Event Display ID"] || "").toLowerCase().trim());
        const userName = String(row["User Name"] || "").toLowerCase().trim();
        const userId = userLookup.get(userName);
        if (!eventId || !userId) return null;
        return {
          tenant_id: tenantId,
          event_id: eventId,
          user_id: userId,
          assignment_role: String(row["Role"] || "Editor").trim(),
          deliverable: String(row["Deliverable"] || "").trim(),
          quantity: Number(row["Quantity"]) || 1,
          total_amount: Number(row["Total"]) || 0,
          advance_paid: Number(row["Advance"]) || 0,
        };
      }).filter(Boolean);
      if (outputRows.length > 0) {
        const { error } = await supabase.from("output_expenses").insert(outputRows as any);
        if (!error) stats.outputExpenses = (outputRows as any[]).length;
      }

      res.json({ message: "Upload processed successfully", stats });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
}
