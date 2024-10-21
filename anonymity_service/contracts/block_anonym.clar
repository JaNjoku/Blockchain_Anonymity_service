;; Blockchain Anonymity Service

;; Define constants
(define-constant contract-owner tx-sender)
(define-constant err-owner-only (err u100))
(define-constant err-already-initialized (err u101))
(define-constant err-not-initialized (err u102))

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
