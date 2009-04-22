# Добавляем несколько статусов для http

ActionController::StatusCodes::STATUS_CODES.merge!(
	440 => "Hurry Synch Error",
	441 => "Late Synch Error"
)