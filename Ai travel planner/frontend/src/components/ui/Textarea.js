export default function Textarea({ value, onChange, placeholder }) {
    return (
      <textarea
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        rows="3"
      />
    );
  }