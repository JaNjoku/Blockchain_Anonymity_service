;; Blockchain Anonymity Service

;; Define constants
(define-constant contract-owner tx-sender)
(define-constant min-message-length u10)
(define-constant max-bulk-messages u5)
;; (define-constant deletion-marker "DELETED")                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       ")))


(define-constant err-owner-only (err u100))
(define-constant err-already-initialized (err u101))
(define-constant err-not-initialized (err u102))
(define-constant err-invalid-message-length (err u103))
(define-constant err-message-not-found (err u104))
(define-constant err-invalid-message-count (err u105))
(define-constant err-message-limit-exceeded (err u106))

;; Define data variables
(define-data-var initialized bool false)
(define-data-var message-counter uint u0)

;; Define data maps
(define-map messages uint {sender: (optional principal), content: (string-utf8 500)})

;; Private function to check if the contract is initialized
(define-private (is-initialized)
  (var-get initialized))

;; Private function to check if the caller is the contract owner
(define-private (is-contract-owner)
  (is-eq tx-sender contract-owner))

;; Public function to initialize the contract
(define-public (initialize)
  (begin
    (asserts! (is-contract-owner) err-owner-only)
    (asserts! (not (is-initialized)) err-already-initialized)
    (var-set initialized true)
    (ok true)))

;; Public function to send an anonymous message
(define-public (send-anonymous-message (content (string-utf8 500)))
  (let ((message-id (var-get message-counter)))
    (asserts! (is-initialized) err-not-initialized)
    (map-set messages message-id {sender: none, content: content})
    (var-set message-counter (+ message-id u1))
    (ok message-id)))

;; Public function to retrieve a message by ID
(define-read-only (get-message (message-id uint))
  (map-get? messages message-id))

;; Public function to get the total number of messages
(define-read-only (get-message-count)
  (var-get message-counter))

;; Public function for the contract owner to pause the service
(define-public (pause-service)
  (begin
    (asserts! (is-contract-owner) err-owner-only)
    (var-set initialized false)
    (ok true)))

;; Public function for the contract owner to resume the service
(define-public (resume-service)
  (begin
    (asserts! (is-contract-owner) err-owner-only)
    (var-set initialized true)
    (ok true)))

;; Public function to delete a message
(define-read-only (is-valid-content (content (string-utf8 500)))
  (let ((content-length (len content)))
    (and (>= content-length min-message-length)
         (< content-length u500))))

;; Public function to check if a message exists
(define-read-only (does-message-exist (message-id uint))
  (match (map-get? messages message-id)
    message true
    false))

;; Public function to get messages count in a specific range
(define-read-only (get-messages-count (start uint) (end uint))
  (if (and (<= start end) 
           (< end (var-get message-counter)))
      (ok (- end start))
      (err err-invalid-message-count)))

;; Public function to send bulk messages (simplified version)
(define-public (send-bulk-messages (content-1 (string-utf8 500)) 
                                 (content-2 (string-utf8 500)))
  (begin
    (asserts! (is-initialized) err-not-initialized)
    (asserts! (and (is-valid-content content-1)
                   (is-valid-content content-2)) 
              err-invalid-message-length)
    (let ((id-1 (var-get message-counter)))
      (begin
        (map-set messages id-1 
                 {sender: none, content: content-1})
        (var-set message-counter (+ id-1 u1))
        (let ((id-2 (var-get message-counter)))
          (begin
            (map-set messages id-2 
                     {sender: none, content: content-2})
            (var-set message-counter (+ id-2 u1))
            (ok {first-id: id-1, second-id: id-2})))))))

;; Public function to get the last valid message ID
(define-read-only (get-last-message-id)
  (let ((counter (var-get message-counter)))
    (if (> counter u0)
        (ok (- counter u1))
        (err err-not-initialized))))
