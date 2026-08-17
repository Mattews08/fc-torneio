import type { StandingRow } from '../domain/tournament'

type StandingsTableProps = {
  standings: StandingRow[]
}

export function StandingsTable({ standings }: StandingsTableProps) {
  return (
    <section className="panel standings-panel">
      <div className="panel-heading">
        <p className="eyebrow">Classificacao</p>
        <h2>Tabela geral</h2>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Pos</th>
              <th>Jogador</th>
              <th>Pts</th>
              <th>J</th>
              <th>V</th>
              <th>E</th>
              <th>D</th>
              <th>GP</th>
              <th>GC</th>
              <th>SG</th>
            </tr>
          </thead>
          <tbody>
            {standings.map((row, index) => (
              <tr key={row.playerId}>
                <td>
                  <span className="position">{index + 1}</span>
                </td>
                <td>
                  <div className="team-cell">
                    <span className="crest">
                      {row.player.crestUrl ? <img src={row.player.crestUrl} alt="" /> : row.player.name.slice(0, 2).toUpperCase()}
                    </span>
                    <div>
                      <strong>{row.player.name}</strong>
                      <span>{row.player.teamName}</span>
                    </div>
                  </div>
                </td>
                <td className="points">{row.points}</td>
                <td>{row.played}</td>
                <td>{row.wins}</td>
                <td>{row.draws}</td>
                <td>{row.losses}</td>
                <td>{row.goalsFor}</td>
                <td>{row.goalsAgainst}</td>
                <td>{row.goalDifference}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
