# Добавляем несколько статусов для http

ActionController::StatusCodes::STATUS_CODES.merge!(
	440 => "Hurry Synch Error",
	441 => "Late Synch Error",
	299 => "No Ommited Actions Will Send"
)

ActionController::StatusCodes::SYMBOL_TO_STATUS_CODE.merge!(
	:hurry_synch_error => 440,
	:late_synch_error => 441,
	:no_ommited_actions_will_send => 299
)