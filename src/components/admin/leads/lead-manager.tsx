"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Field, FormSection } from "@/components/admin/form/field";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/admin/ui/alert-dialog";
import { Button } from "@/components/admin/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/admin/ui/select";
import { Textarea } from "@/components/admin/ui/textarea";
import { LeadStatus } from "@/generated/prisma/enums";
import { LEAD_STATUS_LABEL } from "@/lib/admin/labels";
import { deleteLead, saveLeadNotes, setLeadStatus } from "@/server/actions/leads";

/** Status, internal notes and delete for one lead. */
export function LeadManager({
  id,
  status: initialStatus,
  notes: initialNotes,
}: {
  id: string;
  status: LeadStatus;
  notes: string;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [notes, setNotes] = useState(initialNotes);
  const [savedNotes, setSavedNotes] = useState(initialNotes);
  const [pending, startTransition] = useTransition();

  function changeStatus(next: LeadStatus) {
    const previous = status;
    setStatus(next);
    startTransition(async () => {
      const res = await setLeadStatus(id, next);
      if (res.ok) {
        toast.success(res.message); // the action refreshes the panel (badge included)
      } else {
        setStatus(previous);
        toast.error(res.error);
      }
    });
  }

  function saveNotes() {
    startTransition(async () => {
      const res = await saveLeadNotes(id, notes);
      if (res.ok) {
        setSavedNotes(notes);
        toast.success(res.message);
      } else toast.error(res.error);
    });
  }

  function remove() {
    startTransition(async () => {
      const res = await deleteLead(id);
      if (res.ok) {
        toast.success(res.message);
        router.push("/admin/consultas");
      } else toast.error(res.error);
    });
  }

  return (
    <FormSection title="Seguimiento">
      <Field id="lead-status" label="Estado" required>
        <Select
          value={status}
          onValueChange={(v) => changeStatus(v as LeadStatus)}
          disabled={pending}
        >
          <SelectTrigger id="lead-status" className="w-full sm:w-64">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.values(LeadStatus).map((s) => (
              <SelectItem key={s} value={s}>
                {LEAD_STATUS_LABEL[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <Field id="lead-notes" label="Notas internas" help="Solo se ven en el panel.">
        <Textarea
          id="lead-notes"
          rows={4}
          maxLength={5000}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </Field>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="sm" disabled={pending}>
              <Trash2 /> Eliminar consulta
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Eliminar consulta?</AlertDialogTitle>
              <AlertDialogDescription>
                Se borran definitivamente los datos de esta persona. Si es spam, alcanza con
                marcarla como «Spam».
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={remove}>Eliminar</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        <Button onClick={saveNotes} disabled={pending || notes === savedNotes}>
          {pending && <Loader2 className="animate-spin" />}
          Guardar notas
        </Button>
      </div>
    </FormSection>
  );
}
