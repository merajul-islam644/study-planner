import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { blocksClient } from "../../lib/blocks/client";
import { Alert } from "../../shared/ui/Alert";
import { useCurrentUser, userDisplayName } from "../profile/useCurrentUser";
import { useProfileMutations } from "../data/store";
import { useFileUpload, openFile } from "../resources/uploads";
import { useProfile } from "../data/store";

export function AccountDetailsSection() {
  const me = useCurrentUser();
  const profileQuery = useProfile();
  const profileMutations = useProfileMutations();
  const queryClient = useQueryClient();
  const profile = me.data?.data;

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setFirstName(profile.firstName ?? "");
    setLastName(profile.lastName ?? "");
  }, [profile]);

  const upload = useFileUpload();

  const saveName = useMutation({
    mutationFn: () => blocksClient.iam.updateMe({ firstName, lastName }),
    onSuccess: async () => {
      setSaved(true);
      await queryClient.invalidateQueries({ queryKey: ["iam", "me"] });
    }
  });

  const saveImage = useMutation({
    mutationFn: (fileId: string) => profileMutations.save.mutateAsync({ profileImageFileId: fileId }),
    onSuccess: () => setSaved(true)
  });

  async function onPickImage(file: File | undefined) {
    if (!file) return;
    const result = await upload.run(file);
    if (result) saveImage.mutate(result.fileId);
  }

  return (
    <div className="settings-section">
      <div className="settings-section-header">
        <h3>Account</h3>
        <p>Your name, email, password and profile image.</p>
      </div>

      <div className="identity-row">
        <span className="avatar avatar-lg">{(userDisplayName(profile) || "?").slice(0, 1).toUpperCase()}</span>
        <div className="grow">
          <div className="identity-name">{userDisplayName(profile) || "Student"}</div>
          <div className="identity-email">{profile?.email}</div>
        </div>
        <label className="ghost-button" style={{ cursor: "pointer" }}>
          {upload.uploading ? "Uploading…" : "Change image"}
          <input type="file" accept="image/*" hidden onChange={(event) => onPickImage(event.target.files?.[0])} />
        </label>
      </div>
      {profileQuery.data?.profileImageFileId ? <button className="link-inline mb0" onClick={() => openFile(profileQuery.data!.profileImageFileId!)}>View current image</button> : null}
      {upload.error ? <div className="field-error">{upload.error}</div> : null}

      <form className="field-grid mt16" onSubmit={(event) => { event.preventDefault(); setSaved(false); saveName.mutate(); }}>
        <label className="form-field"><span>First name</span><input value={firstName} onChange={(event) => { setFirstName(event.target.value); setSaved(false); }} /></label>
        <label className="form-field"><span>Last name</span><input value={lastName} onChange={(event) => { setLastName(event.target.value); setSaved(false); }} /></label>
        <label className="form-field field-span"><span>Email</span><input value={profile?.email ?? ""} readOnly disabled /></label>
        <div className="form-actions"><button className="primary-button" type="submit" disabled={saveName.isPending}>{saveName.isPending ? "Saving…" : "Save name"}</button></div>
      </form>

      <PasswordChange />
      {saved ? <Alert tone="info">Your profile has been saved.</Alert> : null}
    </div>
  );
}

function PasswordChange() {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [saved, setSaved] = useState(false);
  const change = useMutation({
    mutationFn: () => blocksClient.auth.changePassword({ oldPassword, newPassword }),
    onSuccess: () => { setSaved(true); setOldPassword(""); setNewPassword(""); }
  });

  return (
    <div className="mt16">
      <h4>Change password</h4>
      <form className="field-grid" onSubmit={(event) => { event.preventDefault(); setSaved(false); change.mutate(); }}>
        <label className="form-field"><span>Current password</span><input type="password" value={oldPassword} onChange={(event) => setOldPassword(event.target.value)} /></label>
        <label className="form-field"><span>New password</span><input type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} /></label>
        <div className="form-actions"><button className="primary-button" type="submit" disabled={change.isPending || !oldPassword || newPassword.length < 8}>{change.isPending ? "Saving…" : "Change password"}</button></div>
      </form>
      {saved ? <Alert tone="info">Your password has been changed.</Alert> : null}
      {change.isError ? <Alert tone="error">{(change.error as Error).message}</Alert> : null}
    </div>
  );
}
