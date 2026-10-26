package za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.scorecard;

public record ScorecardScores(
        Integer attendance,
        Integer communication,
        Integer accountability,
        Integer creativity,
        Integer delivery,
        Integer techSkills) {
}
