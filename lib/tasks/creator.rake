require 'rake'
namespace :create do
	desc "Reset migrations and create all users and game types"
	task :refresh => :environment do
		Rake::Task['db:migrate:reset'].invoke

		User.delete_all
		GameTypes::Base.delete_all

		user = Admin.new :password => '1111', :password_confirmation => '1111'
		user.login = "user#{0}"
		user.email = "user#{0}@mail.ru"
		user.save!
		user.create_chips_purse :balance => 10000
		user.create_money_purse
		user.money_purse.receive 1000
		
		5.times do |i|
			user = User.new :password => '1111', :password_confirmation => '1111'
			user.login = "user#{i+1}"
			user.email = "user#{i+1}@mail.ru"
			user.save!
			user.create_chips_purse :balance => 10000
			user.create_money_purse
			user.money_purse.receive 1000
		end

		6.times do |i|
      type = GameTypes::Base.factory(kind = rand(2), :title => "Стандартный техасский №#{i+1}",
				:max_players => rand(3) + 2,
				:start_stack => 1000 * (i + 1),
				:start_payment => kind.zero? ? nil : i * 20 + 10,
				:start_blind => 100 * (i + 1),
				:change_level_time => 4 + i,
				:time_for_action => 30,
				:min_level => 0,
				:max_level => 10
      )
			type.save!
			type.winner_prizes.create :grade => 1, :prize_part => 0.7
			type.winner_prizes.create :grade => 2, :prize_part => 0.3
    end
		
    Rake::Task['log:clear'].invoke
	end
end
