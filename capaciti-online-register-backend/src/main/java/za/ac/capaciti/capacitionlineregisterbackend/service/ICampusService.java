package za.ac.capaciti.capacitionlineregisterbackend.service;

import java.util.List;
import java.util.UUID;

import jakarta.servlet.http.HttpServletRequest;
import za.ac.capaciti.capacitionlineregisterbackend.domain.User;
import za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.campus.CampusDto;
import za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.campus.UpdateCampusRequest;

public interface ICampusService {

    List<CampusDto> list();

    CampusDto update(UUID id, UpdateCampusRequest request, User actor);

    CampusDto addCurrentIp(UUID id, HttpServletRequest request, User actor);

    CampusDto removeCidr(UUID id, String cidr, User actor);
}