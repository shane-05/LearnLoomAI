import { careerGuide } from './agents/career-guide'
import { learningCoach } from './agents/learning-coach'
import { technicalTutor } from './agents/technical-tutor'
import { practicePartner } from './agents/practice-partner'
import { portfolioMentor } from './agents/portfolio-mentor'
import { momentumGuide } from './agents/momentum-guide'

export const specialistAgents = [careerGuide, learningCoach, technicalTutor, practicePartner, portfolioMentor, momentumGuide] as const

export function chooseSpecialist(message: string) {
  const text = message.toLowerCase()
  if (/career|role|job|industry|profession/.test(text)) return careerGuide
  if (/portfolio|project|github|showcase|resume|cv/.test(text)) return portfolioMentor
  if (/practice|quiz|exercise|challenge|try this/.test(text)) return practicePartner
  if (/motivat|burn.?out|stuck|overwhelm|habit|routine/.test(text)) return momentumGuide
  if (/learn|roadmap|study|plan|where (do|should) i start/.test(text)) return learningCoach
  return technicalTutor
}
