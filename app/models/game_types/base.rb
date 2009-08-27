class GameTypes::Base < ActiveRecord::Base
	set_table_name :game_types
  has_many :games
  has_many :blind_values, :foreign_key => 'game_type_id', :dependent => :delete_all
	has_many :winner_prizes, :order => 'grade', :foreign_key => 'game_type_id', :dependent => :delete_all

	validate :check_start_stack_and_blind
	validates_presence_of :title, :start_stack, :start_blind
	validates_length_of :title, :within => 10..40
	validates_numericality_of :start_stack, :start_blind, :greater_than_or_equal_to => 0

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

  def get_blind_size level
    BlindValue.find_by_game_type_id_and_level(id, level)
  end
	
	def get_payment user
    purse(user).pay(payment_value)
  end

	def return_payment user
		purse(user).receive(payment_value)
	end

	def may_be_created_by? user
		purse(user).has?(payment_value) and verify_user_level(user.level)
	end

	def give_prize_to_winner player
		if winner_prize = winner_prizes.find_by_grade(player.place)
			purse(player.user).receive(bank * winner_prize.prize_part)
		end
	end

	def bank
		max_players * start_payment
	end

	protected

	def verify_user_level level
    level >= min_level and level <= max_level
  end

	def check_start_stack_and_blind
		if !start_stack or !start_blind or start_stack < start_blind
			errors.add(:start_stack, I18n.t('activerecord.errors.messages.wrong_start_stack_size'))
		end
	end
end
