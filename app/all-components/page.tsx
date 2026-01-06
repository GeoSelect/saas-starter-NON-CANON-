
import { GeneralSettingsForm } from "@/components/settings/general-settings-form";
import { SecuritySettingsForm } from "@/components/settings/security-settings-form";
import { TeamSettingsForm } from "@/components/settings/team-settings-form";

export default function AllComponentsPage() {
  return (
    <section className="space-y-12">
      <div>
        <h2>General Settings Assets</h2>
        <div className="max-w-md">
          <GeneralSettingsForm initialData={{ name: "Playground User", email: "test@example.com" }} />
        </div>
      </div>
      <div>
        <h2>Security Settings Assets</h2>
        <div className="max-w-md">
          <SecuritySettingsForm />
        </div>
      </div>
      <div>
        <h2>Team Settings Assets</h2>
        <div className="max-w-2xl">
          <TeamSettingsForm />
        </div>
      </div>
    </section>
  );
}