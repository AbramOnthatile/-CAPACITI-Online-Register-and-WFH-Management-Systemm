package za.ac.capaciti.capacitionlineregisterbackend.service;

import java.time.LocalDate;

import za.ac.capaciti.capacitionlineregisterbackend.domain.User;

public interface IPromptGeneratorService {

    int generateForDate(LocalDate date);

    int generateForUser(User user, LocalDate date);
}