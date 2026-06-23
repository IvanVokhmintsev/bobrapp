import {
  createEmptyMember,
  type ProfileMember,
} from "../../../lib/profileMembers";

type ProfileMembersEditorProps = {
  value: ProfileMember[];
  onChange: (members: ProfileMember[]) => void;
  label?: string;
};

export function ProfileMembersEditor(props: ProfileMembersEditorProps) {
  const members = props.value.length ? props.value : [createEmptyMember()];

  function updateMember(index: number, patch: Partial<ProfileMember>) {
    const next = members.map((member, memberIndex) =>
      memberIndex === index ? { ...member, ...patch } : member,
    );
    props.onChange(next);
  }

  function removeMember(index: number) {
    const next = members.filter((_, memberIndex) => memberIndex !== index);
    props.onChange(next.length ? next : [createEmptyMember()]);
  }

  function addMember() {
    if (members.length >= 20) {
      return;
    }

    props.onChange([...members, createEmptyMember()]);
  }

  return (
    <div className="profile-form-field">
      <span className="profile-form-field__label">{props.label ?? "Состав группы"}</span>
      <div className="profile-members-editor">
        {members.map((member, index) => (
          <div className="profile-members-editor__row" key={`member-${index}`}>
            <input
              value={member.name}
              onChange={(event) => updateMember(index, { name: event.target.value })}
              placeholder="Имя"
              aria-label={`Имя участника ${index + 1}`}
              maxLength={60}
            />
            <input
              value={member.role}
              onChange={(event) => updateMember(index, { role: event.target.value })}
              placeholder="Роль"
              aria-label={`Роль участника ${index + 1}`}
              maxLength={60}
            />
            <button
              type="button"
              className="profile-members-editor__remove"
              aria-label={`Удалить участника ${index + 1}`}
              onClick={() => removeMember(index)}
              disabled={members.length === 1 && !member.name && !member.role}
            >
              ×
            </button>
          </div>
        ))}
        <button
          type="button"
          className="profile-form-add"
          onClick={addMember}
          disabled={members.length >= 20}
        >
          + Добавить участника
        </button>
      </div>
    </div>
  );
}
