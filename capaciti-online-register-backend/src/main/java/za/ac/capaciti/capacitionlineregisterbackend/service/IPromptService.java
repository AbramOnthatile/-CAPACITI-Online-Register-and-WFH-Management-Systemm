package za.ac.capaciti.capacitionlineregisterbackend.service;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import za.ac.capaciti.capacitionlineregisterbackend.domain.User;
import za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.prompt.PromptListResponse;
import za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.prompt.PromptReviewDto;
import za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.prompt.SubmitPromptRequest;
import za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.prompt.SubmitPromptResponse;

public interface IPromptService {

    PromptListResponse active(String email);

    PromptListResponse today(String email);

    int activateDue();

    int expireOverdue();

    int closeForClockOut(User user, LocalDate date);

    SubmitPromptResponse submit(String email, UUID promptId, SubmitPromptRequest request);

    List<PromptReviewDto> review(String email, LocalDate date);
}