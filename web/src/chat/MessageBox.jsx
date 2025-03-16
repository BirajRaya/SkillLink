export default function MessageBox({ text, sender }) {
  return (
    <div className={`flex ${sender === "me" ? "justify-end" : "justify-start"}`}>
      <div className={`p-3 rounded-lg max-w-xs text-white ${sender === "me" ? "bg-blue-600" : "bg-gray-700"}`}>
        {text}
      </div>
    </div>
  );
}
