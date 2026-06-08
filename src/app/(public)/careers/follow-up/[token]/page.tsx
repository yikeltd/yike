import { CareerFollowUpForm } from "@/components/careers/follow-up-form";
import { SITE_NAME } from "@/lib/constants";

type Props = { params: Promise<{ token: string }> };

export const metadata = {
  title: `Application follow-up — ${SITE_NAME}`,
  description: "Complete your Yike careers application follow-up.",
};

export default async function CareerFollowUpPage({ params }: Props) {
  const { token } = await params;

  return (
    <div className="pb-12 pt-6">
      <div className="mx-auto max-w-xl px-3">
        <CareerFollowUpForm token={token} />
      </div>
    </div>
  );
}
