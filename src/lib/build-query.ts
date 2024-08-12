export interface QueryParams {
  title?: string;
  workingTime?: string;
  location?: string;
  level?: string;
  skills?: string;
}

export const buildQuery = (params: QueryParams) => {
  const { title, workingTime, location, level, skills } = params;
  const query: any = {};

  if (title) {
    query.title = new RegExp(title, "i");
  }
  if (workingTime) {
    query.workingTime = new RegExp(workingTime, "i");
  }
  if (location) {
    query.location = new RegExp(location, "i");
  }
  if (level) {
    query.level = new RegExp(level, "i");
  }
  if (skills) {
    const skillsArray = skills
      .split(",")
      .map((skill) => new RegExp(skill.trim(), "i"));
    query.techSkills = { $elemMatch: { $in: skillsArray } };
  }

  return query;
};
