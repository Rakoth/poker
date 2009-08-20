class GameTypes::Base < ActiveRecord::Base
	set_table_name :game_types
  has_many :games
  has_many :blind_values

	validate :check_start_stack_and_blind
	validates_presence_of :title, :start_stack, :start_blind, :start_payment
	validates_length_of :title, :within => 10..40
	validates_numericality_of :start_stack, :start_blind, :start_payment, :greater_than_or_equal_to => 0

	FREE = 0
	PAID = 1

  named_scope :for_create, :select => 'id, title'

	def self.factory main_type, params
		case main_type.to_i
		when FREE
			GameTypes::Free.new params
		when PAID
			GameTypes::Paid.new params
		else
			raise 'Unknown game type'
		end
	end
  def prize
    start_payment * max_players
  end

  def get_blind_size level
    BlindValue.find_by_game_type_id_and_level(id, level)
  end

	protected

	def verify_user_level level
    level >= min_level and level <= max_level
  end

	def check_start_stack_and_blind
		errors.add(:start_stack, I18n.t('activerecord.errors.messages.wrong_start_stack_size')) if !start_stack || start_stack < start_blind
	end
end
