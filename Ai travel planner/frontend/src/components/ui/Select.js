export default function Select({ children, value, onChange }) {
    return (
      <select
        value={value}
        onChange={onChange}
        className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {children}
      </select>
    );
  }