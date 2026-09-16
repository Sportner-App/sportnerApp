import UserNotifications

/// Downloads the sender's photo referenced by the push payload's `richContent.image` URL
/// (set server-side in ExpoPushSender.cs) and attaches it to the notification before it's
/// shown, so the OS displays it as the large icon — same effect as WhatsApp's chat avatars.
/// Android gets this for free from Expo; iOS needs this extension to actually fetch the image.
class NotificationService: UNNotificationServiceExtension {
  var contentHandler: ((UNNotificationContent) -> Void)?
  var bestAttemptContent: UNMutableNotificationContent?

  override func didReceive(
    _ request: UNNotificationRequest,
    withContentHandler contentHandler: @escaping (UNNotificationContent) -> Void
  ) {
    self.contentHandler = contentHandler
    bestAttemptContent =
      (request.content.mutableCopy() as? UNMutableNotificationContent)

    if let bestAttemptContent = bestAttemptContent {
      if let userInfo = request.content.userInfo["body"] as? [String: Any],
        let richContent = userInfo["_richContent"] as? [String: Any],
        let imageUrlString = richContent["image"] as? String,
        let imageUrl = URL(string: imageUrlString) {
        downloadAndAttachImage(url: imageUrl, to: bestAttemptContent) { content in
          contentHandler(content)
        }
      } else {
        contentHandler(bestAttemptContent)
      }
    }
  }

  private func downloadAndAttachImage(
    url: URL,
    to content: UNMutableNotificationContent,
    completion: @escaping (UNNotificationContent) -> Void
  ) {
    let task = URLSession.shared.downloadTask(with: url) { temporaryFileLocation, _, error in
      guard let temporaryFileLocation = temporaryFileLocation else {
        completion(content)
        return
      }

      let fileManager = FileManager.default
      let tempDirectory = URL(fileURLWithPath: NSTemporaryDirectory())
      let targetFileName = temporaryFileLocation.lastPathComponent + ".jpg"
      let targetUrl = tempDirectory.appendingPathComponent(targetFileName)

      try? fileManager.removeItem(at: targetUrl)

      do {
        try fileManager.moveItem(at: temporaryFileLocation, to: targetUrl)

        let attachment = try UNNotificationAttachment(
          identifier: "image",
          url: targetUrl,
          options: nil
        )

        content.attachments = [attachment]
      } catch {
        print("Error processing attachment: \(error.localizedDescription)")
      }

      completion(content)
    }

    task.resume()
  }

  override func serviceExtensionTimeWillExpire() {
    // Called just before the extension will be terminated by the system.
    // Use this as an opportunity to deliver your "best attempt" at modified content, otherwise the original push payload will be used.
    if let contentHandler = contentHandler,
      let bestAttemptContent = bestAttemptContent {
      contentHandler(bestAttemptContent)
    }
  }
}
