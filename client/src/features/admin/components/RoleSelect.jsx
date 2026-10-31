import SelectField from "../../../components/shared/SelectField";
 
export default function RoleSelect({ control, roles }) {
  return (
    <SelectField
      name="roleIds"
      control={control}
      label="Roles"
      multiple
      options={roles.map((r) => ({ value: r.id, label: r.name }))}
      rules={{
        validate: (v) => (v && v.length > 0) || "Select at least one role",
      }}
    />
  );
}
