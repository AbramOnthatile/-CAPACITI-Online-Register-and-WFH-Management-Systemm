package za.ac.capaciti.capacitionlineregisterbackend.domain;

import java.util.ArrayList;
import java.util.List;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "campus_hubs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CampusHub extends BaseEntity {

    @Column(name = "name", nullable = false, unique = true)
    private String name;

    @Column(name = "latitude", nullable = false)
    private double latitude;

    @Column(name = "longitude", nullable = false)
    private double longitude;

    @Builder.Default
    @Column(name = "radius_m", nullable = false, columnDefinition = "integer default 300")
    private int radiusM = 300;

    @Builder.Default
    @JdbcTypeCode(SqlTypes.ARRAY)
    @Column(name = "whitelisted_cidrs", nullable = false, columnDefinition = "text[] default '{}'::text[]")
    private List<String> whitelistedCidrs = new ArrayList<>();
}