package za.ac.capaciti.capacitionlineregisterbackend.service;

import java.time.LocalDate;

import za.ac.capaciti.capacitionlineregisterbackend.domain.AttendanceRecord;

public interface IPromptGeneratorService {

    int generateOnClockIn(AttendanceRecord attendance);

    int generateForClockedIn(LocalDate date);
}
