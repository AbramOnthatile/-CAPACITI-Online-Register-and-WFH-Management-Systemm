package za.ac.capaciti.capacitionlineregisterbackend.service;

import za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.dashboard.CandidateDashboardDto;
import za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.dashboard.ChampionDashboardDto;

public interface IDashboardService {

    CandidateDashboardDto candidate(String email);

    ChampionDashboardDto champion();
}
