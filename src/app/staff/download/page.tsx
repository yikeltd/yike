import Image from "next/image";
import Link from "next/link";
import { crewBrand } from "@/lib/design/tokens";
import { STAFF_APP_START_PATH } from "@/lib/admin/staff-app";

export const metadata = {
  title: "Install Yike Crew",
  robots: { index: false, follow: false },
};

const APK_PATH = "/downloads/yike-crew.apk";
const APK_SIZE = "2.4 MB";

export default function StaffDownloadPage() {
  return (
    <main className="mx-auto flex min-h-[100dvh] max-w-md flex-col px-5 pb-10 pt-[max(2rem,env(safe-area-inset-top))]">
      <div className="flex flex-col items-center text-center">
        <Image
          src={crewBrand.icon512Png}
          alt=""
          width={96}
          height={96}
          className="rounded-2xl shadow-lg ring-1 ring-white/10"
          priority
        />
        <h1 className="mt-5 text-2xl font-semibold tracking-tight">{crewBrand.name}</h1>
        <p className="mt-2 text-sm text-white/70">
          Internal operations app for Yike staff. Install on your phone, then sign in with your crew account.
        </p>
      </div>

      <div className="mt-8 space-y-3">
        <a
          href={APK_PATH}
          download="yike-crew.apk"
          className="flex w-full items-center justify-center rounded-xl bg-gold px-4 py-3.5 text-base font-semibold text-navy shadow-sm transition active:scale-[0.98]"
        >
          Download Android app ({APK_SIZE})
        </a>
        <Link
          href={STAFF_APP_START_PATH}
          className="flex w-full items-center justify-center rounded-xl border border-white/15 bg-white/5 px-4 py-3.5 text-base font-medium text-white transition active:scale-[0.98]"
        >
          Open in browser
        </Link>
      </div>

      <section className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-4">
        <h2 className="text-sm font-semibold text-gold">Install steps (Android)</h2>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-white/75">
          <li>Tap download and wait for the file to finish.</li>
          <li>Open the APK from your notification or Downloads folder.</li>
          <li>If prompted, allow installs from your browser or Files app.</li>
          <li>Open Yike Crew and sign in with your staff email.</li>
        </ol>
      </section>

      <section className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
        <h2 className="text-sm font-semibold text-gold">No install? Use the web app</h2>
        <p className="mt-2 text-sm text-white/75">
          Visit{" "}
          <Link href={STAFF_APP_START_PATH} className="text-gold underline-offset-2 hover:underline">
            yike.ng/staff
          </Link>{" "}
          in Chrome, then tap Add to Home screen for a similar experience.
        </p>
      </section>

      <p className="mt-auto pt-8 text-center text-xs text-white/45">
        Crew access only. Unauthorized use is prohibited.
      </p>
    </main>
  );
}
