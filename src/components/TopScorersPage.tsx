import { Goal, Medal } from 'lucide-react'
import type { TopScorerRow } from '../domain/tournament'

type TopScorersPageProps = {
  scorers: TopScorerRow[]
}

export function TopScorersPage({ scorers }: TopScorersPageProps) {
  return (
    <section className="panel scorers-panel">
      <div className="panel-heading split">
        <div>
          <p className="eyebrow">Artilheiros</p>
          <h2>Ranking de gols</h2>
        </div>
        <span className="admin-badge">
          <Goal size={16} aria-hidden="true" />
          {scorers.reduce((total, scorer) => total + scorer.goals, 0)} gols
        </span>
      </div>

      {scorers.length > 0 ? (
        <div className="scorers-list">
          {scorers.map((scorer, index) => (
            <article className="scorer-card" key={scorer.key}>
              <span className="position scorer-position">{index + 1}</span>
              <div className="scorer-main">
                <strong>{scorer.name}</strong>
                <span>{scorer.teamName}</span>
              </div>
              <div className="scorer-stats">
                <strong>{scorer.goals}</strong>
                <span>{scorer.goals === 1 ? 'gol' : 'gols'}</span>
              </div>
              <div className="scorer-stats muted-stat">
                <Medal size={16} aria-hidden="true" />
                <span>{scorer.matches} jogos</span>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <Goal size={28} aria-hidden="true" />
          <strong>Nenhum artilheiro cadastrado ainda.</strong>
          <span>Abra uma rodada, adicione os nomes dos goleadores da partida e salve o placar.</span>
        </div>
      )}
    </section>
  )
}
