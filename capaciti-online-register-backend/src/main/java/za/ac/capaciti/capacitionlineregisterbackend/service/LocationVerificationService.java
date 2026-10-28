package za.ac.capaciti.capacitionlineregisterbackend.service;

import org.springframework.stereotype.Service;

import za.ac.capaciti.capacitionlineregisterbackend.domain.CampusHub;

@Service
public class LocationVerificationService {

    private static final double EARTH_RADIUS_M = 6_371_000d;

    public Double distanceToCampus(CampusHub campus, Double latitude, Double longitude) {
        if (campus == null || latitude == null || longitude == null) {
            return null;
        }
        if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180) {
            return null;
        }
        return haversine(campus.getLatitude(), campus.getLongitude(), latitude, longitude);
    }

    public boolean isWithinRadius(CampusHub campus, Double distanceM) {
        return campus != null && distanceM != null && distanceM <= campus.getRadiusM();
    }

    static double haversine(double lat1, double lon1, double lat2, double lon2) {
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        return EARTH_RADIUS_M * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }
}
