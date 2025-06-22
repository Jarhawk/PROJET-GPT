export default function InputField({ label, value, onChange, error, ...props }) {
  return (
    <div className="mb-4">
      <label className="block text-sm text-gray-300 mb-1">{label}</label>
      <input
        value={value}
        onChange={onChange}
        className={`w-full p-2 bg-zinc-900 border rounded-xl ${error ? "border-red-500" : "border-zinc-600"}`}
        {...props}
      />
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
}
