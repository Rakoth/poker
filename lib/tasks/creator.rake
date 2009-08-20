require 'rake'
namespace :create do
	desc "Reset migrations and create all users and game types"
	task :refresh => :environment do
		Rake::Task['db:migrate:reset'].invoke

		User.delete_all
		GameTypes::Base.delete_all
		5.times do |i|
			user = User.new :password => '1111', :password_confirmation => '1111'
			user.login = "user#{i+1}"
			user.email = "user#{i+1}@mail.ru"
			user.save
			user.create_chips_purse :balance => 1000
			user.create_money_purse
			user.money_purse.receive 1000
		end

		user = Admin.new :password => '1111', :password_confirmation => '1111'
		user.login = "user#{0}"
		user.email = "user#{0}@mail.ru"
		user.save
		user.create_chips_purse :balance => 1000
		user.create_money_purse
		user.money_purse.receive 1000

		3.times do |i|
      GameTypes::Free.create(:title => " #{i+1} Тип",
				:max_players => 2 + i,
				:start_stack => 1000 * (i + 1),
				:start_payment => i + 5,
				:start_blind => 100 * (i + 1),
				:bet_multiplier => 1,
				:change_level_time => 4 + i,
				:time_for_action => 30,
				:min_level => 0,
				:max_level => 10
      )
    end
		
    Rake::Task['log:clear'].invoke
	end
end
