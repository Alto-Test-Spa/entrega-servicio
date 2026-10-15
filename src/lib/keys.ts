// Claves de `EntregaState.values`: una por cada texto editable que no vive en tables/photos/findings.
export const keys = {
  fact: (sectionId: string, index: number) => `${sectionId}.fact${index}`,
  conclusion: (sectionId: string) => `${sectionId}.conclusion`,
  title: (sectionId: string) => `${sectionId}.title`,
  column: (sectionId: string, index: number) => `${sectionId}.col${index}`,
  objective: 'identification.objective',
  summary: 'identification.summary',
  note: (sectionId: string) => `${sectionId}.note`,
  legend: (sectionId: string) => `${sectionId}.legend`,
  annexValidity: (sectionId: string, index: number) => `${sectionId}.annex${index}.validity`,
}
