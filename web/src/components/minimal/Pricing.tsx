export function Pricing() {
  const plans = [
    { name: 'Pay‑as‑you‑go', price: '€0.50/min', desc: 'Only pay for what you use.' },
    { name: 'Monthly', price: '€29/mo', desc: 'Included minutes + lower rates.', active: true },
    { name: 'Pre‑book', price: 'from €4/slot', desc: 'Reserve ahead, skip the wait.' },
  ]
  return (
    <section className="bg-[#F3F3F3]">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {plans.map((p) => (
            <div key={p.name} className={`rounded-2xl border p-8 shadow-sm ${p.active ? 'border-[#3A7BD5] bg-white' : 'border-[#E6E6E6] bg-white'}`}>
              <h3 className="text-[16px] font-medium text-[#222]">{p.name}</h3>
              <div className="mt-2 text-[24px] font-semibold text-[#222]">{p.price}</div>
              <p className="mt-2 text-[14px] text-[#222]/70">{p.desc}</p>
              <button className={`mt-6 w-full rounded-full px-5 py-3 text-sm font-medium transition-colors ${p.active ? 'bg-[#3A7BD5] text-white hover:bg-[#316bb9]' : 'border border-[#E2E2E2] text-[#222] hover:bg-[#F9F9F9]'}`}>Choose</button>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
