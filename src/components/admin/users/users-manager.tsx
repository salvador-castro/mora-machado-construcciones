"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { KeyRound, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Field } from "@/components/admin/form/field";
import { useActionForm } from "@/components/admin/form/use-action-form";
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
import { Badge } from "@/components/admin/ui/badge";
import { Button } from "@/components/admin/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/admin/ui/dialog";
import { Input } from "@/components/admin/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/admin/ui/select";
import { Switch } from "@/components/admin/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/admin/ui/table";
import {
  passwordResetSchema,
  userCreateSchema,
  userUpdateSchema,
  type PasswordResetInput,
  type UserCreateInput,
} from "@/lib/admin/schemas";
import { PASSWORD_MIN } from "@/lib/auth/password-policy";
import { createUser, deleteUser, resetUserPassword, updateUser } from "@/server/actions/users";

export type UserRow = {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "EDITOR";
  active: boolean;
  lastLogin: string | null;
  isMe: boolean;
};

const ROLE_LABEL = { ADMIN: "Administrador", EDITOR: "Editor" } as const;

type Dialogs =
  { kind: "new" } | { kind: "edit"; user: UserRow } | { kind: "password"; user: UserRow };

export function UsersManager({ rows }: { rows: UserRow[] }) {
  const router = useRouter();
  const [dialog, setDialog] = useState<Dialogs | null>(null);
  const [deleting, startDelete] = useTransition();
  const close = () => setDialog(null);
  const done = () => {
    close();
    router.refresh();
  };

  function remove(user: UserRow) {
    startDelete(async () => {
      const res = await deleteUser(user.id);
      if (res.ok) {
        toast.success(res.message);
        router.refresh();
      } else toast.error(res.error);
    });
  }

  return (
    <div className="space-y-4">
      <Button onClick={() => setDialog({ kind: "new" })}>
        <Plus /> Nuevo usuario
      </Button>

      <div className="overflow-hidden rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Usuario</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead className="hidden md:table-cell">Último ingreso</TableHead>
              <TableHead className="text-right">
                <span className="sr-only">Acciones</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((u) => (
              <TableRow key={u.id}>
                <TableCell className="w-full max-w-0">
                  <span className="block truncate font-medium">
                    {u.name}
                    {u.isMe && <span className="font-normal text-muted-foreground"> (vos)</span>}
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">{u.email}</span>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    <Badge variant={u.role === "ADMIN" ? "default" : "secondary"}>
                      {ROLE_LABEL[u.role]}
                    </Badge>
                    {!u.active && <Badge variant="outline">Inactivo</Badge>}
                  </div>
                </TableCell>
                <TableCell className="hidden whitespace-nowrap text-muted-foreground md:table-cell">
                  {u.lastLogin ?? "Nunca"}
                </TableCell>
                <TableCell className="text-right whitespace-nowrap">
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Editar a ${u.name}`}
                    onClick={() => setDialog({ kind: "edit", user: u })}
                  >
                    <Pencil />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Cambiar contraseña de ${u.name}`}
                    onClick={() => setDialog({ kind: "password", user: u })}
                  >
                    <KeyRound />
                  </Button>
                  {!u.isMe && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Eliminar a ${u.name}`}
                          disabled={deleting}
                        >
                          <Trash2 />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>¿Eliminar a {u.name}?</AlertDialogTitle>
                          <AlertDialogDescription>
                            No se puede deshacer. Sus notas quedan sin autor. Si solo querés
                            quitarle el acceso, desactivalo desde «Editar».
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => remove(u)}>Eliminar</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialog !== null} onOpenChange={(open) => !open && close()}>
        <DialogContent className="sm:max-w-md">
          {dialog?.kind === "new" && (
            <>
              <DialogHeader>
                <DialogTitle>Nuevo usuario</DialogTitle>
                <DialogDescription>
                  Pasale el email y la contraseña por un canal seguro. Puede cambiarla desde «Mi
                  cuenta».
                </DialogDescription>
              </DialogHeader>
              <UserForm user={null} onCancel={close} onSaved={done} />
            </>
          )}
          {dialog?.kind === "edit" && (
            <>
              <DialogHeader>
                <DialogTitle>Editar usuario</DialogTitle>
                <DialogDescription>
                  Si cambiás el rol o lo desactivás, se cierran sus sesiones abiertas.
                </DialogDescription>
              </DialogHeader>
              <UserForm user={dialog.user} onCancel={close} onSaved={done} />
            </>
          )}
          {dialog?.kind === "password" && (
            <>
              <DialogHeader>
                <DialogTitle>Cambiar contraseña</DialogTitle>
                <DialogDescription>
                  Nueva contraseña para {dialog.user.name}. Se cierran sus sesiones abiertas.
                </DialogDescription>
              </DialogHeader>
              <PasswordForm userId={dialog.user.id} onCancel={close} onSaved={close} />
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function UserForm({
  user,
  onCancel,
  onSaved,
}: {
  user: UserRow | null;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const form = useForm<UserCreateInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- create/update schemas differ
    resolver: zodResolver((user ? userUpdateSchema : userCreateSchema) as any),
    defaultValues: user
      ? { name: user.name, email: user.email, role: user.role, active: user.active, password: "" }
      : { name: "", email: "", role: "EDITOR", active: true, password: "" },
  });
  const { register, control, formState } = form;
  const errors = formState.errors;
  const { submit, pending } = useActionForm(
    form,
    (values) => (user ? updateUser(user.id, values) : createUser(values)),
    { onSuccess: onSaved },
  );
  const self = user?.isMe ?? false;

  return (
    <form onSubmit={submit} className="space-y-5" noValidate>
      <Field id="u-name" label="Nombre" required error={errors.name?.message}>
        <Input id="u-name" {...register("name")} />
      </Field>
      <Field id="u-email" label="Email" required error={errors.email?.message}>
        <Input id="u-email" type="email" autoComplete="off" {...register("email")} />
      </Field>
      {!user && (
        <Field
          id="u-password"
          label="Contraseña"
          help={`Mínimo ${PASSWORD_MIN} caracteres.`}
          required
          error={errors.password?.message}
        >
          <Input
            id="u-password"
            type="password"
            autoComplete="new-password"
            {...register("password")}
          />
        </Field>
      )}
      <Field
        id="u-role"
        label="Rol"
        required
        help={self ? "No podés cambiar tu propio rol." : undefined}
        error={errors.role?.message}
      >
        <Controller
          control={control}
          name="role"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange} disabled={self}>
              <SelectTrigger id="u-role" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="EDITOR">{ROLE_LABEL.EDITOR}</SelectItem>
                <SelectItem value="ADMIN">{ROLE_LABEL.ADMIN}</SelectItem>
              </SelectContent>
            </Select>
          )}
        />
      </Field>
      {user && !self && (
        <Controller
          control={control}
          name="active"
          render={({ field }) => (
            <label className="flex items-start justify-between gap-4 rounded-md border p-3 text-sm">
              <span>
                <span className="font-medium">Activo</span>
                <span className="block text-xs text-muted-foreground">
                  Un usuario inactivo no puede entrar al panel.
                </span>
              </span>
              <Switch checked={field.value} onCheckedChange={field.onChange} />
            </label>
          )}
        />
      )}
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel} disabled={pending}>
          Cancelar
        </Button>
        <Button type="submit" disabled={pending}>
          {pending && <Loader2 className="animate-spin" />}
          {user ? "Guardar" : "Crear usuario"}
        </Button>
      </DialogFooter>
    </form>
  );
}

function PasswordForm({
  userId,
  onCancel,
  onSaved,
}: {
  userId: string;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const form = useForm<PasswordResetInput>({
    resolver: zodResolver(passwordResetSchema),
    defaultValues: { password: "" },
  });
  const { submit, pending } = useActionForm(form, (values) => resetUserPassword(userId, values), {
    onSuccess: onSaved,
  });

  return (
    <form onSubmit={submit} className="space-y-5" noValidate>
      <Field
        id="r-password"
        label="Nueva contraseña"
        help={`Mínimo ${PASSWORD_MIN} caracteres.`}
        required
        error={form.formState.errors.password?.message}
      >
        <Input
          id="r-password"
          type="password"
          autoComplete="new-password"
          {...form.register("password")}
        />
      </Field>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel} disabled={pending}>
          Cancelar
        </Button>
        <Button type="submit" disabled={pending}>
          {pending && <Loader2 className="animate-spin" />}
          Cambiar contraseña
        </Button>
      </DialogFooter>
    </form>
  );
}
