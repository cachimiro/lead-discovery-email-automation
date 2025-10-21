"use client";

type Props = {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  helpText?: string;
};

export default function FormField({ label, name, type = "text", placeholder, required, helpText }: Props) {
  return (
    <div className="space-y-2">
      <label htmlFor={name} className="block text-sm font-semibold text-slate-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <input
        type={type}
        name={name}
        id={name}
        placeholder={placeholder}
        required={required}
        className="input-premium w-full"
      />
      {helpText && (
        <p className="text-xs text-slate-500">{helpText}</p>
      )}
    </div>
  );
}
