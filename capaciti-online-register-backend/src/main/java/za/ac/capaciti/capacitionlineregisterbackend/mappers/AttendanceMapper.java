package za.ac.capaciti.capacitionlineregisterbackend.mappers;

import org.springframework.stereotype.Component;

import za.ac.capaciti.capacitionlineregisterbackend.domain.AttendanceRecord;
import za.ac.capaciti.capacitionlineregisterbackend.domain.User;
import za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.attendance.AttendanceDto;

@Component
public class AttendanceMapper {

    public AttendanceDto toDto(AttendanceRecord attendanceRecord) {
        if (attendanceRecord == null) {
            return null;
        }

        User user = attendanceRecord.getUser();

        return new AttendanceDto(
                attendanceRecord.getId(),
                user == null ? null : user.getId(),
                user == null ? null : user.getFullName(),
                attendanceRecord.getAttendanceDate(),
                attendanceRecord.getWorkMode(),
                attendanceRecord.getClockInAt(),
                attendanceRecord.getClockOutAt(),
                attendanceRecord.getArrivalStatus(),
                attendanceRecord.getDepartureStatus(),
                attendanceRecord.getLateReason(),
                attendanceRecord.getEarlyClockoutReason(),
                attendanceRecord.getLateClockoutNote(),
                attendanceRecord.getDeliverableLink(),
                attendanceRecord.getIpVerified(),
                attendanceRecord.getGeoVerified(),
                attendanceRecord.getDistanceM(),
                attendanceRecord.isAiQualityFlag());
    }
}