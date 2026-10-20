package za.ac.capaciti.capacitionlineregisterbackend.service;

import za.ac.capaciti.capacitionlineregisterbackend.domain.User;
import za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.common.QualityResult;

public interface IQualityGateService {
    QualityResult check(User user, String category, String draftKey, String content);
}
