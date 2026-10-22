package za.ac.capaciti.capacitionlineregisterbackend.service;

import za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.storage.SignedUrlResponse;

public interface IStorageService {
    SignedUrlResponse signedUrl(String email, String bucket, String path);
}
