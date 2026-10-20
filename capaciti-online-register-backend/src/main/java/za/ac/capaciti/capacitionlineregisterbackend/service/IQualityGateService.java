package za.ac.capaciti.capacitionlineregisterbackend.service;

import za.ac.capaciti.capacitionlineregisterbackend.domain.User;
import za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.common.QualityResult;
import za.ac.capaciti.capacitionlineregisterbackend.enums.QualityContext;

public interface IQualityGateService {

    QualityResult check(User user, QualityContext context, String contextRef, String text);
}