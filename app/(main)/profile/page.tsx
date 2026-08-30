import { ProfileSettings } from "@/components/profile/profile-settings";
import { ExamCountdown } from "@/components/profile/exam-countdown";
import { LocalBackup } from "@/components/profile/local-backup";
import { AccountSync } from "@/components/profile/account-sync";
import { StudyIdentity } from "@/components/profile/study-identity";
import { PageIntro } from "@/components/ui/page-intro";

export const metadata = { title: "Profile" };

export default function ProfilePage() {
  return <div className="mx-auto max-w-5xl"><PageIntro eyebrow="Profile · your settings" title="Make the path yours." description="Set a gentle daily pace and an optional JLPT target date." /><div className="space-y-6"><StudyIdentity /><ProfileSettings /><ExamCountdown /><AccountSync /><LocalBackup /></div></div>;
}
