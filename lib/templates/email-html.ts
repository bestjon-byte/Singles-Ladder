import { formatDate } from 'date-fns'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://singles-ladder.vercel.app'

interface BaseEmailProps {
  recipientName: string
}

interface ChallengeReceivedEmailProps extends BaseEmailProps {
  challengerName: string
  proposedDate: string
  proposedLocation: string
  challengeId: string
  isWildcard: boolean
}

interface ChallengeAcceptedEmailProps extends BaseEmailProps {
  challengedName: string
  acceptedDate: string
  acceptedLocation: string
  challengeId: string
}

interface ChallengeRejectedEmailProps extends BaseEmailProps {
  challengedName: string
  challengeId: string
}

interface ChallengeWithdrawnEmailProps extends BaseEmailProps {
  challengerName: string
  challengeId: string
}

interface MatchScoreSubmittedEmailProps extends BaseEmailProps {
  opponentName: string
  submitterName: string
  winner: string
  set1Score: string
  set2Score: string
  set3Score?: string
  matchId: string
}

interface ScoreDisputedEmailProps extends BaseEmailProps {
  opponentName: string
  disputedByName: string
  set1Score: string
  set2Score: string
  set3Score?: string
  matchId: string
}

interface NewUserSignupEmailProps {
  adminName: string
  newUserName: string
  newUserEmail: string
  newUserWhatsapp?: string
}

// Base email template with consistent styling
const emailWrapper = (content: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .container {
      background-color: #ffffff;
      border-radius: 8px;
      padding: 30px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 3px solid #10b981;
    }
    .header h1 {
      color: #10b981;
      margin: 0;
      font-size: 28px;
    }
    .emoji {
      font-size: 48px;
      margin-bottom: 10px;
    }
    .content {
      margin-bottom: 30px;
    }
    .info-box {
      background-color: #f3f4f6;
      border-left: 4px solid #10b981;
      padding: 15px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .info-box strong {
      color: #10b981;
    }
    .button {
      display: inline-block;
      padding: 12px 24px;
      background-color: #10b981;
      color: #ffffff !important;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      margin: 10px 5px;
      text-align: center;
    }
    .button:hover {
      background-color: #059669;
    }
    .button-secondary {
      background-color: #6b7280;
    }
    .button-secondary:hover {
      background-color: #4b5563;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      color: #6b7280;
      font-size: 14px;
    }
    .score-table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    .score-table th,
    .score-table td {
      padding: 10px;
      text-align: left;
      border-bottom: 1px solid #e5e7eb;
    }
    .score-table th {
      background-color: #f9fafb;
      font-weight: 600;
    }
    .wildcard-badge {
      display: inline-block;
      background-color: #fbbf24;
      color: #78350f;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 600;
      margin-left: 10px;
    }
  </style>
</head>
<body>
  <div class="container">
    ${content}
    <div class="footer">
      <p>Tennis Singles Ladder</p>
      <p>You're receiving this email because you have email notifications enabled.</p>
      <p><a href="${APP_URL}/profile" style="color: #10b981;">Update notification preferences</a></p>
    </div>
  </div>
</body>
</html>
`

export function generateChallengeReceivedEmail(props: ChallengeReceivedEmailProps): { subject: string; html: string } {
  const formattedDate = formatDate(new Date(props.proposedDate), 'PPP p')
  const wildcardBadge = props.isWildcard ? '<span class="wildcard-badge">WILDCARD</span>' : ''

  const content = `
    <div class="header">
      <div class="emoji">🎾</div>
      <h1>You've Been Challenged!</h1>
    </div>
    <div class="content">
      <p>Hi <strong>${props.recipientName}</strong>,</p>
      <p><strong>${props.challengerName}</strong> has challenged you to a match${props.isWildcard ? ' using a wildcard' : ''}!${wildcardBadge}</p>

      <div class="info-box">
        <p><strong>📅 Proposed Date:</strong> ${formattedDate}</p>
        <p style="margin-bottom: 0;"><strong>📍 Proposed Location:</strong> ${props.proposedLocation}</p>
      </div>

      <p>Accept this challenge in the Matches tab.</p>

      <div style="text-align: center; margin-top: 30px;">
        <a href="${APP_URL}/matches" class="button">View Challenge</a>
      </div>

      <p style="margin-top: 30px; font-size: 14px; color: #6b7280;">
        Good luck on the court! 🎾
      </p>
    </div>
  `

  return {
    subject: `🎾 You've been challenged by ${props.challengerName}!`,
    html: emailWrapper(content)
  }
}

export function generateChallengeAcceptedEmail(props: ChallengeAcceptedEmailProps): { subject: string; html: string } {
  const formattedDate = formatDate(new Date(props.acceptedDate), 'PPP p')

  const content = `
    <div class="header">
      <div class="emoji">✅</div>
      <h1>Challenge Accepted!</h1>
    </div>
    <div class="content">
      <p>Hi <strong>${props.recipientName}</strong>,</p>
      <p>Great news! <strong>${props.challengedName}</strong> has accepted your challenge.</p>

      <div class="info-box">
        <p><strong>📅 Match Date:</strong> ${formattedDate}</p>
        <p style="margin-bottom: 0;"><strong>📍 Location:</strong> ${props.acceptedLocation}</p>
      </div>

      <p>The match is now scheduled. Don't forget to submit the score after you play!</p>

      <div style="text-align: center; margin-top: 30px;">
        <a href="${APP_URL}/matches" class="button">View Match Details</a>
      </div>

      <p style="margin-top: 30px; font-size: 14px; color: #6b7280;">
        Good luck and play well! 🎾
      </p>
    </div>
  `

  return {
    subject: `✅ ${props.challengedName} accepted your challenge!`,
    html: emailWrapper(content)
  }
}

export function generateChallengeRejectedEmail(props: ChallengeRejectedEmailProps): { subject: string; html: string } {
  const content = `
    <div class="header">
      <div class="emoji">❌</div>
      <h1>Challenge Declined</h1>
    </div>
    <div class="content">
      <p>Hi <strong>${props.recipientName}</strong>,</p>
      <p><strong>${props.challengedName}</strong> has declined your challenge.</p>

      <p>Don't worry - you can challenge other players on the ladder!</p>

      <div style="text-align: center; margin-top: 30px;">
        <a href="${APP_URL}/dashboard" class="button">View Ladder</a>
        <a href="${APP_URL}/matches" class="button button-secondary">My Matches</a>
      </div>
    </div>
  `

  return {
    subject: `Challenge declined by ${props.challengedName}`,
    html: emailWrapper(content)
  }
}

export function generateChallengeWithdrawnEmail(props: ChallengeWithdrawnEmailProps): { subject: string; html: string } {
  const content = `
    <div class="header">
      <div class="emoji">↩️</div>
      <h1>Challenge Withdrawn</h1>
    </div>
    <div class="content">
      <p>Hi <strong>${props.recipientName}</strong>,</p>
      <p><strong>${props.challengerName}</strong> has withdrawn their challenge.</p>

      <p>You're now free to accept other challenges or create your own!</p>

      <div style="text-align: center; margin-top: 30px;">
        <a href="${APP_URL}/dashboard" class="button">View Ladder</a>
      </div>
    </div>
  `

  return {
    subject: `${props.challengerName} withdrew their challenge`,
    html: emailWrapper(content)
  }
}

export function generateMatchScoreSubmittedEmail(props: MatchScoreSubmittedEmailProps): { subject: string; html: string } {
  const isWinner = props.recipientName === props.winner
  const emoji = isWinner ? '🏆' : '🎾'
  const resultText = isWinner ? 'Congratulations!' : 'Match Result'

  const content = `
    <div class="header">
      <div class="emoji">${emoji}</div>
      <h1>${resultText}</h1>
    </div>
    <div class="content">
      <p>Hi <strong>${props.recipientName}</strong>,</p>
      <p><strong>${props.submitterName}</strong> has submitted the match score for your game against <strong>${props.opponentName}</strong>.</p>

      <div class="info-box">
        <p style="margin-bottom: 10px;"><strong>Match Result:</strong></p>
        <table class="score-table">
          <tr>
            <th>Set</th>
            <th>Score</th>
          </tr>
          <tr>
            <td>Set 1</td>
            <td>${props.set1Score}</td>
          </tr>
          <tr>
            <td>Set 2</td>
            <td>${props.set2Score}</td>
          </tr>
          ${props.set3Score ? `
          <tr>
            <td>Set 3</td>
            <td>${props.set3Score}</td>
          </tr>
          ` : ''}
        </table>
        <p style="font-size: 18px; margin-top: 15px; margin-bottom: 0;">
          <strong>Winner:</strong> ${props.winner} ${isWinner ? '🏆' : ''}
        </p>
      </div>

      ${isWinner ? '<p>Congratulations on your victory! 🎉</p>' : '<p>Better luck next time! Keep practicing! 💪</p>'}

      <div style="text-align: center; margin-top: 30px;">
        <a href="${APP_URL}/matches" class="button">View Match Details</a>
        <a href="${APP_URL}/dashboard" class="button button-secondary">View Ladder</a>
      </div>

      <p style="margin-top: 30px; font-size: 14px; color: #6b7280;">
        If you believe this score is incorrect, you can dispute it from the match details page.
      </p>
    </div>
  `

  return {
    subject: isWinner ? `🏆 You won against ${props.opponentName}!` : `Match result: ${props.opponentName} vs You`,
    html: emailWrapper(content)
  }
}

export function generateScoreDisputedEmail(props: ScoreDisputedEmailProps): { subject: string; html: string } {
  const content = `
    <div class="header">
      <div class="emoji">⚠️</div>
      <h1>Match Score Disputed</h1>
    </div>
    <div class="content">
      <p>Hi <strong>${props.recipientName}</strong>,</p>
      <p><strong>${props.disputedByName}</strong> has disputed the score for your match against <strong>${props.opponentName}</strong>.</p>

      <div class="info-box">
        <p style="margin-bottom: 10px;"><strong>Disputed Match Score:</strong></p>
        <table class="score-table">
          <tr>
            <th>Set</th>
            <th>Score</th>
          </tr>
          <tr>
            <td>Set 1</td>
            <td>${props.set1Score}</td>
          </tr>
          <tr>
            <td>Set 2</td>
            <td>${props.set2Score}</td>
          </tr>
          ${props.set3Score ? `
          <tr>
            <td>Set 3</td>
            <td>${props.set3Score}</td>
          </tr>
          ` : ''}
        </table>
      </div>

      <p><strong>What happens next?</strong></p>
      <ul>
        <li>The match result has been flagged for review</li>
        <li>An admin will review the dispute and make a decision</li>
        <li>You'll be notified once the dispute is resolved</li>
      </ul>

      <div style="text-align: center; margin-top: 30px;">
        <a href="${APP_URL}/matches" class="button">View Match Details</a>
      </div>

      <p style="margin-top: 30px; font-size: 14px; color: #6b7280;">
        If you have any questions, please contact the ladder administrator.
      </p>
    </div>
  `

  return {
    subject: `⚠️ Match score disputed: ${props.opponentName}`,
    html: emailWrapper(content)
  }
}

export function generateNewUserSignupEmail(props: NewUserSignupEmailProps): { subject: string; html: string } {
  const content = `
    <div class="header">
      <div class="emoji">👤</div>
      <h1>New Player Signed Up</h1>
    </div>
    <div class="content">
      <p>Hi <strong>${props.adminName}</strong>,</p>
      <p>A new player has joined the Tennis Singles Ladder!</p>

      <div class="info-box">
        <p><strong>Player Details:</strong></p>
        <p><strong>Name:</strong> ${props.newUserName}</p>
        <p><strong>Email:</strong> ${props.newUserEmail}</p>
        ${props.newUserWhatsapp ? `<p style="margin-bottom: 0;"><strong>WhatsApp:</strong> ${props.newUserWhatsapp}</p>` : '<p style="margin-bottom: 0;">No WhatsApp number provided</p>'}
      </div>

      <p><strong>Next steps:</strong></p>
      <ul>
        <li>The new player will need to be added to the ladder by an admin</li>
        <li>You can add them from the Ladder Management page</li>
      </ul>

      <div style="text-align: center; margin-top: 30px;">
        <a href="${APP_URL}/admin/ladder" class="button">Manage Ladder</a>
        <a href="${APP_URL}/dashboard" class="button button-secondary">View Dashboard</a>
      </div>
    </div>
  `

  return {
    subject: `👤 New player signup: ${props.newUserName}`,
    html: emailWrapper(content)
  }
}
