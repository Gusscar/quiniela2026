import { Team } from '@/types';

interface TeamCardProps {
  team: Team;
  onClick?: () => void;
}

export function TeamCard({ team, onClick }: TeamCardProps) {
  return (
    <div
      onClick={onClick}
      className="bg-secondary rounded-lg p-4 border border-border hover:border-primary/50 transition cursor-pointer"
    >
      <div className="flex items-center gap-3">
        {team.flag_url ? (
          <img
            src={team.flag_url}
            alt={team.name}
            className="w-10 h-10 object-contain"
          />
        ) : (
          <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center text-lg">
            {team.name.charAt(0)}
          </div>
        )}
        <div>
          <h3 className="font-semibold">{team.name}</h3>
          <span className="text-sm text-muted-foreground">Grupo {team.group_letter}</span>
        </div>
      </div>
    </div>
  );
}

export function TeamCardSkeleton() {
  return (
    <div className="bg-secondary rounded-lg p-4 border border-border">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 skeleton rounded-full" />
        <div className="space-y-2">
          <div className="w-24 h-4 skeleton rounded" />
          <div className="w-16 h-3 skeleton rounded" />
        </div>
      </div>
    </div>
  );
}
