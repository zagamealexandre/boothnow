import Image from 'next/image'

export default function AppSection() {
  return (
    <section className="py-32 bg-white">
      <div className="mx-auto max-w-4xl px-12 grid md:grid-cols-2 gap-20 items-center">
        <div>
          <h3 className="font-heading text-3xl tracking-[0.18em] text-kubo-textDark">DOWNLOAD THE APP TODAY</h3>
          <div className="mt-6 text-kubo-textGrey max-w-md">
            <p className="text-lg italic font-body">"Kubo has made my working days around the city more efficient and convenient."</p>
            <p className="mt-2 text-sm font-body">— Oskar A., Consultant</p>
          </div>
          <div className="mt-8">
            <a href="#" className="inline-block">
              <Image 
                src="/images/downloadapp.png" 
                alt="Download on the App Store" 
                width={160}
                height={48}
                className="hover:opacity-90 transition-opacity"
              />
            </a>
          </div>
        </div>
        <div className="flex justify-center relative">
          {/* Front phone - boothB.png */}
          <div className="relative z-10 w-64 h-96 mr-10">
            <Image 
              src="/images/boothB.png" 
              alt="App interface" 
              width={256}
              height={384}
              className="rounded-3xl shadow-2xl"
            />
          </div>
          
          {/* Back phone - boothA.png (slightly smaller and peeking) */}
          <div className="absolute right-[-100px] top-6 w-[232px] h-[348px] z-0">
            <Image 
              src="/images/boothA.png" 
              alt="App interface background" 
              width={232}
              height={348}
              className="rounded-3xl shadow-xl"
            />
          </div>
        </div>
      </div>
    </section>
  )
}


