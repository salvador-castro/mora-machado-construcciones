"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { Field, FormSection } from "@/components/admin/form/field";
import { useActionForm } from "@/components/admin/form/use-action-form";
import { Button } from "@/components/admin/ui/button";
import { Input } from "@/components/admin/ui/input";
import {
  accountSchema,
  changePasswordSchema,
  type AccountInput,
  type ChangePasswordInput,
} from "@/lib/admin/schemas";
import { PASSWORD_MIN } from "@/lib/auth/password-policy";
import { changePassword, updateAccount } from "@/server/actions/users";

export function AccountForm({ initial }: { initial: AccountInput }) {
  const router = useRouter();
  const form = useForm<AccountInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- input/output types differ (transforms)
    resolver: zodResolver(accountSchema as any),
    defaultValues: initial,
  });
  const { register, formState } = form;
  const { submit, pending } = useActionForm(form, updateAccount, {
    onSuccess: () => router.refresh(),
  });

  return (
    <form onSubmit={submit} noValidate>
      <FormSection title="Datos personales">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field id="a-name" label="Nombre" required error={formState.errors.name?.message}>
            <Input id="a-name" autoComplete="name" {...register("name")} />
          </Field>
          <Field
            id="a-email"
            label="Email"
            help="Es el que usás para entrar."
            required
            error={formState.errors.email?.message}
          >
            <Input id="a-email" type="email" autoComplete="email" {...register("email")} />
          </Field>
        </div>
        <div className="flex justify-end">
          <Button type="submit" disabled={pending || !formState.isDirty}>
            {pending && <Loader2 className="animate-spin" />}
            Guardar datos
          </Button>
        </div>
      </FormSection>
    </form>
  );
}

const EMPTY_PASSWORDS: ChangePasswordInput = { current: "", password: "", confirm: "" };

export function ChangePasswordForm() {
  const form = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: EMPTY_PASSWORDS,
  });
  const { register, formState } = form;
  const { submit, pending } = useActionForm(form, changePassword, {
    onSuccess: () => form.reset(EMPTY_PASSWORDS),
  });

  return (
    <form onSubmit={submit} noValidate>
      <FormSection
        title="Cambiar contraseña"
        description="Al cambiarla se cierran tus sesiones en otros dispositivos."
      >
        <Field
          id="p-current"
          label="Contraseña actual"
          required
          error={formState.errors.current?.message}
        >
          <Input
            id="p-current"
            type="password"
            autoComplete="current-password"
            {...register("current")}
          />
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            id="p-password"
            label="Nueva contraseña"
            help={`Mínimo ${PASSWORD_MIN} caracteres.`}
            required
            error={formState.errors.password?.message}
          >
            <Input
              id="p-password"
              type="password"
              autoComplete="new-password"
              {...register("password")}
            />
          </Field>
          <Field
            id="p-confirm"
            label="Repetir nueva contraseña"
            required
            error={formState.errors.confirm?.message}
          >
            <Input
              id="p-confirm"
              type="password"
              autoComplete="new-password"
              {...register("confirm")}
            />
          </Field>
        </div>
        <div className="flex justify-end">
          <Button type="submit" disabled={pending || !formState.isDirty}>
            {pending && <Loader2 className="animate-spin" />}
            Cambiar contraseña
          </Button>
        </div>
      </FormSection>
    </form>
  );
}
