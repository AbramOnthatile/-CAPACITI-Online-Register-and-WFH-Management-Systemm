package za.ac.capaciti.capacitionlineregisterbackend.domain;

import java.time.Instant;
import java.time.LocalDate;

import za.ac.capaciti.capacitionlineregisterbackend.enums.ArrivalStatus;
import za.ac.capaciti.capacitionlineregisterbackend.enums.DepartureStatus;
import za.ac.capaciti.capacitionlineregisterbackend.enums.WorkMode;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "attendance_records", uniqueConstraints = @UniqueConstraint(columnNames = { "user_id", "attendance_date" }))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AttendanceRecord extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "attendance_date", nullable = false)
    private LocalDate attendanceDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "work_mode", nullable = false)
    private WorkMode workMode;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "wfh_request_id")
    private WfhRequest wfhRequest;

    @Column(name = "clock_in_at")
    private Instant clockInAt;

    @Column(name = "clock_out_at")
    private Instant clockOutAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "arrival_status")
    private ArrivalStatus arrivalStatus;

    @Enumerated(EnumType.STRING)
    @Column(name = "departure_status")
    private DepartureStatus departureStatus;

    @Column(name = "late_reason")
    private String lateReason;

    @Column(name = "early_clockout_reason")
    private String earlyClockoutReason;

    @Column(name = "late_clockout_note")
    private String lateClockoutNote;

    @Column(name = "deliverable_link")
    private String deliverableLink;

    @Column(name = "client_ip")
    private String clientIp;

    @Column(name = "ip_verified")
    private Boolean ipVerified;

    @Column(name = "geo_verified")
    private Boolean geoVerified;

    @Column(name = "latitude")
    private Double latitude;

    @Column(name = "longitude")
    private Double longitude;

    @Column(name = "distance_m")
    private Double distanceM;

    @Column(name = "accuracy_m")
    private Double accuracyM;

    @Builder.Default
    @Column(name = "ai_quality_flag", nullable = false, columnDefinition = "boolean default false")
    private boolean aiQualityFlag = false;
}