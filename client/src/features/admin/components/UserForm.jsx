import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import FormDialog from "../../../components/shared/FormDialog";
import TextField from "../../../components/shared/TextField";
import RoleSelect from "./RoleSelect";
import { useCreateUser, useUpdateUser } from "../../../hooks/useUsers";
import { getErrorMessage } from "../../../utils/getErrorMessage";
 
const EMPTY = { username: "", fullName: "", email: "", roleIds: [], password: "" };
 
export default function UserForm({ open, user, roles, onClose, onSaved }) {
  const isEdit = Boolean(user);
  const { control, handleSubmit, reset } = useForm({ defaultValues: EMPTY });
  const createMutation = useCreateUser();
  const updateMutation = useUpdateUser();
  const [serverError, setServerError] = useState(null);
 
  useEffect(() => {
    if (!open) return;
    setServerError(null);
    reset(
      user
        ? {
            username: user.username,
            fullName: user.fullName,
            email: user.email ?? "",
            roleIds: user.roles.map((r) => r.id),
            password: "",
          }
        : EMPTY
    );
  }, [open, user, reset]);
 
  const submitting = createMutation.isPending || updateMutation.isPending;
 
  const onSubmit = async (values) => {
    setServerError(null);
    const payload = {
      fullName: values.fullName.trim(),
      email: values.email.trim(),
      roleIds: values.roleIds,
    };
    try {
      if (isEdit) {
        if (values.password) payload.password = values.password;
        await updateMutation.mutateAsync({ id: user.id, ...payload });
        onSaved("User updated");
      } else {
        await createMutation.mutateAsync({
          ...payload,
          username: values.username.trim(),
          password: values.password,
        });
        onSaved("User created");
      }
    } catch (err) {
      setServerError(getErrorMessage(err));
    }
  };
 
  const passwordRules = isEdit
    ? {
        validate: (v) => !v || v.length >= 8 || "Minimum 8 characters",
      }
    : {
        required: "Password is required",
        minLength: { value: 8, message: "Minimum 8 characters" },
      };
 
  return (
    <FormDialog
      open={open}
      title={isEdit ? "Edit user" : "New user"}
      submitLabel={isEdit ? "Save changes" : "Create user"}
      submitting={submitting}
      error={serverError}
      onClose={onClose}
      onSubmit={handleSubmit(onSubmit)}
    >
      <TextField
        name="username"
        control={control}
        label="Username"
        disabled={isEdit}
        autoComplete="off"
        rules={{
          required: "Username is required",
          minLength: { value: 3, message: "Minimum 3 characters" },
          pattern: {
            value: /^[A-Za-z0-9._-]+$/,
            message: "Use only letters, numbers, dot, dash or underscore",
          },
        }}
      />
      <TextField
        name="fullName"
        control={control}
        label="Full name"
        rules={{ required: "Full name is required" }}
      />
      <TextField
        name="email"
        control={control}
        label="Email (optional)"
        type="email"
        rules={{
          pattern: {
            value: /^$|^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            message: "Enter a valid email",
          },
        }}
      />
      <RoleSelect control={control} roles={roles} />
      <TextField
        name="password"
        control={control}
        label={isEdit ? "New password (leave blank to keep current)" : "Password"}
        type="password"
        autoComplete="new-password"
        rules={passwordRules}
      />
    </FormDialog>
  );
}
