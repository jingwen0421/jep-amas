import { Info, Server, Code2, Database } from 'lucide-react';

export default function AboutSystem() {
  const items = [
    { label: 'System Name', value: 'JEP Academy Management System' },
    { label: 'Version', value: '1.0.0' },
    { label: 'Frontend', value: 'React + TypeScript' },
    { label: 'Backend', value: 'Supabase' },
    { label: 'Database', value: 'PostgreSQL' },
    { label: 'Status', value: 'Development / Pre-deployment' },
  ];

  return (
    <div className="bg-white rounded-xl p-6 border border-[rgba(40,67,66,0.1)]">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 rounded-lg bg-[#e9da95]/20 text-[#284342]">
          <Info size={22} />
        </div>
        <h2 className="text-xl text-[#284342]">About System</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {items.map((item) => (
          <div key={item.label} className="p-4 rounded-lg bg-[#f8f8f6]">
            <p className="text-xs text-[#6b6b6b]">{item.label}</p>
            <p className="text-sm text-[#284342] mt-1">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">
        <TechCard icon={<Code2 size={22} />} label="Frontend" value="React" />
        <TechCard icon={<Server size={22} />} label="Hosting" value="Vercel Ready" />
        <TechCard icon={<Database size={22} />} label="Database" value="Supabase" />
      </div>
    </div>
  );
}

function TechCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="p-4 rounded-lg border border-[rgba(40,67,66,0.1)]">
      <div className="text-[#284342] mb-2">{icon}</div>
      <p className="text-xs text-[#6b6b6b]">{label}</p>
      <p className="text-sm text-[#284342]">{value}</p>
    </div>
  );
}