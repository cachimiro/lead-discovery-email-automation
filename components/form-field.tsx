"use client";

type Props = {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
};

export default function FormField({ label, name, type = "text", placeholder }: Props) {
  return (
    <div className="space-y-1">
      <label htmlFor={name} className="block text-sm font-medium text-slate-700">
        {label}
      </label>
      <input
        type={type}
        name={name}
        id={name}
        placeholder={placeholder}
        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-red-500 focus:ring-1 focus:ring-red-500"
      />
    </div>
  );
}
