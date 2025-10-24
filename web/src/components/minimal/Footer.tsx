export function MinimalFooter() {
  const links = {
    Company: ['About', 'Careers', 'Press'],
    Support: ['Help Center', 'Contact', 'Status'],
    Legal: ['Privacy', 'Terms', 'Cookie']
  }
  return (
    <footer className="bg-[#EFEFEF] border-t border-[#E4E4E4]">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="grid grid-cols-2 gap-8 text-sm text-[#222]/70 sm:grid-cols-4">
          <div className="col-span-2 sm:col-span-1">
            <div className="text-base font-semibold text-[#222]">BoothNow</div>
            <p className="mt-2 max-w-xs">Minimal workspaces for maximal focus.</p>
          </div>
          {Object.entries(links).map(([title, items]) => (
            <div key={title}>
              <div className="font-medium text-[#222]">{title}</div>
              <ul className="mt-2 space-y-2">
                {items.map((i) => (
                  <li key={i}><a href="#" className="hover:underline">{i}</a></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </footer>
  )
}
