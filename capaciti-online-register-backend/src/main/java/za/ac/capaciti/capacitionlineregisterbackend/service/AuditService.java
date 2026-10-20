package za.ac.capaciti.capacitionlineregisterbackend.service;

import java.util.Map;
import java.util.UUID;
import org.springframework.stereotype.Service;

@Service
public class AuditService {
    public void log(String event, UUID targetId, String targetType, Map<String, Object> details) {
        // no-op scaffold
    }
}
